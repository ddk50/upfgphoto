require "rails_helper"

# 深い階層・パス途中への公開設定変更が「対象サブツリーにだけ」効くことの検証。
# clear_descendants は FolderRenamer と同じ LIKE 前方一致実装なので、
# 並走サブツリー・接頭辞兄弟の分離をホワイトボックス (全カラム突合) で固定する
RSpec.describe AccessRuleUpdater do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }

  def photo!(user, path, file)
    Photo.create!(user: user, folder_path: path, file_name: file, title: file,
                  taken_at: Time.current)
  end

  def guest_rule!(path, issuer)
    AccessRule.create!(folder_path: path, mode: "guest")
    ShareLink.create!(token: ShareLink.generate_token, folder_path: path,
                      issued_by: issuer, issued_at: Time.current)
  end

  before do
    # /a/b の下に c と y の2サブツリーが並走し、接頭辞兄弟 /a/b/cX もいる
    %w[d e f g].each { |n| photo!(a, "/a/b/c/#{n}", "c-#{n}.jpg") }
    %w[z 0 1 2].each { |n| photo!(b, "/a/b/y/#{n}", "y-#{n}.jpg") }
    photo!(a, "/a/b/cX", "cx.jpg")
    FolderOwner.create!(folder_path: "/a/b/c", user: a)
    FolderOwner.create!(folder_path: "/a/b/c/d", user: a)
    FolderOwner.create!(folder_path: "/a/b/y", user: b)
    FolderOwner.create!(folder_path: "/a/b/cX", user: a)

    guest_rule!("/a/b/c/d", a)
    AccessRule.create!(folder_path: "/a/b/c/e", mode: "restricted")
              .access_rule_members.create!(user: b)
    guest_rule!("/a/b/y/z", b)
    guest_rule!("/a/b/cX", a)
  end

  describe "ルート (/) の保護" do
    it "admin でもルートには一切のルールを設定できない (clear_descendants 併用も不可)" do
      %w[everyone restricted guest inherit].each do |mode|
        expect {
          described_class.apply!(folder_path: "/", mode: mode, actor: admin)
        }.to raise_error(described_class::InvalidTarget)
      end

      expect {
        described_class.apply!(folder_path: "/", mode: "inherit", actor: admin,
                               clear_descendants: true)
      }.to raise_error(described_class::InvalidTarget)
      expect(AccessRule.count).to eq(4) # 既存ルールが巻き添えで消えていない
    end
  end

  describe "パス途中への clear_descendants (ADR-013)" do
    it "/a/b/c 配下の子孫ルールだけ消え、並走サブツリー・接頭辞兄弟は全カラム無変更" do
      before_state = snapshot
      described_class.apply!(folder_path: "/a/b/c", mode: "everyone", actor: a,
                             clear_descendants: true)
      after_state = snapshot

      # 対象サブツリー外のテーブルは完全無変更
      [ Photo, FolderOwner, User, Identity, Tag, Tagging ].each do |m|
        expect(after_state[m]).to eq(before_state[m])
      end

      # ルールは「/a/b/c の everyone が増え、配下の2つ (d guest / e restricted) が消えた」だけ。
      # 生き残り (/a/b/y/z, /a/b/cX) は行レベルで同一
      expect(after_state[AccessRule].map { |r| r.slice("folder_path", "mode") }).to contain_exactly(
        { "folder_path" => "/a/b/c",   "mode" => "everyone" },
        { "folder_path" => "/a/b/y/z", "mode" => "guest" },
        { "folder_path" => "/a/b/cX",  "mode" => "guest" }
      )
      survivors = ->(rows) { rows.select { |r| [ "/a/b/y/z", "/a/b/cX" ].include?(r["folder_path"]) } }
      expect(survivors.call(after_state[AccessRule])).to eq(survivors.call(before_state[AccessRule]))

      # restricted 削除に伴いメンバー行も残骸なく消える
      expect(after_state[AccessRuleMember]).to eq([])

      # 共有リンク: /a/b/c/d だけ parent-override で停止し、他の行は全カラム無変更
      revoked = after_state[ShareLink].find { |l| l["folder_path"] == "/a/b/c/d" }
      expect(revoked["revoked_reason"]).to eq("parent-override")
      expect(revoked["revoked_by_id"]).to eq(a.id)
      others = ->(rows) { rows.reject { |l| l["folder_path"] == "/a/b/c/d" } }
      expect(others.call(after_state[ShareLink])).to eq(others.call(before_state[ShareLink]))
    end
  end

  describe "clear_descendants なしのパス途中変更 (ADR-013: 自動上書きしない)" do
    it "/a/b への everyone 適用でルールが1行増えるだけで、深い子孫ルールは全カラム無変更" do
      before_state = snapshot
      described_class.apply!(folder_path: "/a/b", mode: "everyone", actor: admin)
      after_state = snapshot

      [ Photo, FolderOwner, User, Identity, Tag, Tagging,
        AccessRuleMember, ShareLink ].each do |m|
        expect(after_state[m]).to eq(before_state[m])
      end
      added = after_state[AccessRule] - before_state[AccessRule]
      expect(added.map { |r| r.slice("folder_path", "mode") })
        .to eq([ { "folder_path" => "/a/b", "mode" => "everyone" } ])
      expect(after_state[AccessRule] - added).to eq(before_state[AccessRule])
    end
  end

  describe "深い階層での guest 解除 (ADR-008/018: 台帳へ manual 停止)" do
    it "/a/b/c/d の解除 (inherit) はそのフォルダのリンクだけ manual 停止し、並走サブツリーのリンクは無傷" do
      described_class.apply!(folder_path: "/a/b/c/d", mode: "inherit", actor: a)

      expect(AccessRule.exists?(folder_path: "/a/b/c/d")).to be false
      d_link = ShareLink.find_by(folder_path: "/a/b/c/d")
      expect(d_link.revoked_at).to be_present
      expect(d_link.revoked_reason).to eq("manual")
      expect(ShareLink.find_by(folder_path: "/a/b/y/z").revoked_at).to be_nil
      expect(ShareLink.find_by(folder_path: "/a/b/cX").revoked_at).to be_nil
    end
  end
end
