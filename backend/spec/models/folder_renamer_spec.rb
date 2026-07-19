require "rails_helper"

RSpec.describe FolderRenamer do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }

  def photo!(user, path, file, deleted_at: nil)
    Photo.create!(user: user, folder_path: path, file_name: file, title: file,
                  taken_at: Time.current, deleted_at: deleted_at)
  end

  # snapshot は spec/support/snapshot_helpers.rb。
  # 「folder_path の前置換だけが起き、それ以外は無変更」を機械的に突合する
  def rewrite_path(path, from, to)
    return to if path == from
    path.start_with?("#{from}/") ? to + path[from.length..] : path
  end

  def expect_only_prefix_rewrite(from:, to:)
    before_state = snapshot
    yield
    expected = before_state.transform_values do |rows|
      rows.map do |attrs|
        next attrs unless attrs.key?("folder_path")

        attrs.merge("folder_path" => rewrite_path(attrs["folder_path"], from, to))
      end
    end
    expect(snapshot).to eq(expected)
  end

  before do
    photo!(a, "/旅行/京都", "1.jpg")
    photo!(b, "/旅行/京都/寺", "2.jpg")
    photo!(a, "/旅行/京都", "3.jpg", deleted_at: Time.current)
    photo!(a, "/旅行/京", "4.jpg") # 前方一致の誤爆検出用 (「京都」の接頭辞)
    FolderOwner.create!(folder_path: "/旅行", user: a)
    FolderOwner.create!(folder_path: "/旅行/京都", user: a)
    FolderOwner.create!(folder_path: "/旅行/京都/寺", user: b)
    AccessRule.create!(folder_path: "/旅行/京都/寺", mode: "guest")
    ShareLink.create!(token: ShareLink.generate_token, folder_path: "/旅行/京都/寺",
                      issued_by: b, issued_at: Time.current)
  end

  it "オーナーは配下の写真 (ゴミ箱内含む)・owner・rule・共有リンクごとリネームできる" do
    new_path = described_class.rename!(folder_path: "/旅行/京都", new_name: "大阪", actor: a)

    expect(new_path).to eq("/旅行/大阪")
    expect(Photo.pluck(:folder_path)).to contain_exactly(
      "/旅行/大阪", "/旅行/大阪", "/旅行/大阪/寺", "/旅行/京"
    )
    expect(FolderOwner.pluck(:folder_path)).to contain_exactly("/旅行", "/旅行/大阪", "/旅行/大阪/寺")
    expect(AccessRule.sole.folder_path).to eq("/旅行/大阪/寺")
    expect(ShareLink.sole.folder_path).to eq("/旅行/大阪/寺")
  end

  it "同名へのリネームは何もせず現パスを返す" do
    expect(described_class.rename!(folder_path: "/旅行/京都", new_name: "京都", actor: a))
      .to eq("/旅行/京都")
  end

  it "オーナー以外は Forbidden、admin は可" do
    expect {
      described_class.rename!(folder_path: "/旅行/京都", new_name: "大阪", actor: b)
    }.to raise_error(described_class::Forbidden)

    expect(described_class.rename!(folder_path: "/旅行/京都", new_name: "大阪", actor: admin))
      .to eq("/旅行/大阪")
  end

  it "他人の restricted に隷属しているフォルダはオーナーでもリネーム不可 (ADR-019)" do
    AccessRule.create!(folder_path: "/旅行/京都", mode: "restricted")

    expect {
      described_class.rename!(folder_path: "/旅行/京都/寺", new_name: "神社", actor: b)
    }.to raise_error(described_class::Forbidden)
  end

  it "同階層に既存フォルダ (ゴミ箱内写真のみでも) があれば Conflict" do
    expect {
      described_class.rename!(folder_path: "/旅行/京都", new_name: "京", actor: a)
    }.to raise_error(described_class::Conflict)

    photo!(a, "/旅行/大阪", "5.jpg", deleted_at: Time.current)
    expect {
      described_class.rename!(folder_path: "/旅行/京都", new_name: "大阪", actor: a)
    }.to raise_error(described_class::Conflict)
  end

  it "行き先に孤児の owner/rule が残っていても掃除してリネームできる" do
    FolderOwner.create!(folder_path: "/旅行/大阪", user: b)
    AccessRule.create!(folder_path: "/旅行/大阪", mode: "everyone")

    described_class.rename!(folder_path: "/旅行/京都", new_name: "大阪", actor: a)
    expect(FolderOwner.find_by(folder_path: "/旅行/大阪").user_id).to eq(a.id)
  end

  describe "深い階層・複数サブツリー" do
    before do
      # /イベント/2024 の下に孫・ひ孫を複数持たせ、紛らわしい兄弟 (/イベント/2024夏 =
      # リネーム対象を接頭辞に持つ) と別サブツリー (/イベント/2025) を並べる
      photo!(a, "/イベント/2024/夏/花火", "f1.jpg")
      photo!(b, "/イベント/2024/夏/祭り", "f2.jpg")
      photo!(a, "/イベント/2024/冬", "f3.jpg")
      photo!(a, "/イベント/2024/冬", "f4.jpg", deleted_at: Time.current)
      photo!(a, "/イベント/2024夏", "f5.jpg")
      photo!(a, "/イベント/2025/夏", "f6.jpg")
      FolderOwner.create!(folder_path: "/イベント", user: a)
      FolderOwner.create!(folder_path: "/イベント/2024", user: a)
      FolderOwner.create!(folder_path: "/イベント/2024/夏", user: a)
      FolderOwner.create!(folder_path: "/イベント/2024/夏/花火", user: a)
      FolderOwner.create!(folder_path: "/イベント/2024夏", user: a)
      AccessRule.create!(folder_path: "/イベント/2024/夏/花火", mode: "guest")
      ShareLink.create!(token: ShareLink.generate_token, folder_path: "/イベント/2024/夏/花火",
                        issued_by: a, issued_at: Time.current)
    end

    it "中間フォルダ (直下写真なし) のリネームで全子孫が深さを問わず追随し、対象外は無傷" do
      described_class.rename!(folder_path: "/イベント/2024", new_name: "2024年", actor: a)

      expect(Photo.where("folder_path LIKE ?", "/イベント%").pluck(:folder_path, :file_name))
        .to contain_exactly(
          [ "/イベント/2024年/夏/花火", "f1.jpg" ],
          [ "/イベント/2024年/夏/祭り", "f2.jpg" ],
          [ "/イベント/2024年/冬",      "f3.jpg" ],
          [ "/イベント/2024年/冬",      "f4.jpg" ],  # ゴミ箱内も追随
          [ "/イベント/2024夏",         "f5.jpg" ],  # 接頭辞が同じだけの兄弟は無傷
          [ "/イベント/2025/夏",        "f6.jpg" ]
        )
      expect(FolderOwner.where("folder_path LIKE ?", "/イベント%").pluck(:folder_path))
        .to contain_exactly(
          "/イベント", "/イベント/2024年", "/イベント/2024年/夏",
          "/イベント/2024年/夏/花火", "/イベント/2024夏"
        )
      expect(AccessRule.find_by(folder_path: "/イベント/2024年/夏/花火")).to be_present
      expect(ShareLink.where("folder_path LIKE ?", "/イベント%").sole.folder_path)
        .to eq("/イベント/2024年/夏/花火")
    end

    it "深い位置のフォルダをリネームしても兄弟・祖先は無傷" do
      described_class.rename!(folder_path: "/イベント/2024/夏/花火", new_name: "打ち上げ", actor: a)

      expect(Photo.find_by(file_name: "f1.jpg").folder_path).to eq("/イベント/2024/夏/打ち上げ")
      expect(Photo.find_by(file_name: "f2.jpg").folder_path).to eq("/イベント/2024/夏/祭り")
      expect(FolderOwner.pluck(:folder_path)).to include("/イベント/2024/夏/打ち上げ", "/イベント/2024/夏")
    end

    # ホワイトボックス検証: 全テーブルをリネーム前後でスナップショットし、
    # 「folder_path の前置換だけが起き、他の全レコード・全カラムは無変更」を機械的に突合する
    describe "全レコード差分" do
      it "folder_path の前置換以外に一切の変更がない" do
        tag = Tag.create!(name: "夜景")
        Tagging.create!(photo: Photo.find_by(file_name: "f1.jpg"), tag: tag)

        expect_only_prefix_rewrite(from: "/イベント/2024", to: "/イベント/2024年") do
          described_class.rename!(folder_path: "/イベント/2024", new_name: "2024年", actor: a)
        end
      end
    end

    it "子孫に他人の restricted ルールがあってもリネームでき、ルールとメンバーが追随する (ADR-019 は祖先方向のみ)" do
      rule = AccessRule.create!(folder_path: "/イベント/2024/夏/祭り", mode: "restricted")
      rule.access_rule_members.create!(user: b)
      FolderOwner.create!(folder_path: "/イベント/2024/夏/祭り", user: b)

      described_class.rename!(folder_path: "/イベント/2024", new_name: "2024年", actor: a)

      moved = AccessRule.find_by(folder_path: "/イベント/2024年/夏/祭り")
      expect(moved).to be_present
      expect(moved.access_rule_members.pluck(:user_id)).to eq([ b.id ])
      expect(FolderOwner.find_by(folder_path: "/イベント/2024年/夏/祭り").user_id).to eq(b.id)
    end
  end

  describe "パス途中のリネーム: 対象サブツリーの葉だけが書き換わり、並走する兄弟サブツリーは完全無変更" do
    before do
      # /a/b の下に c と y の2サブツリーが並走し、それぞれ複数の葉を持つ
      %w[d e f g].each { |n| photo!(a, "/a/b/c/#{n}", "c-#{n}.jpg") }
      %w[z 0 1 2].each { |n| photo!(b, "/a/b/y/#{n}", "y-#{n}.jpg") }
      FolderOwner.create!(folder_path: "/a/b/c", user: a)
      FolderOwner.create!(folder_path: "/a/b/y", user: b)
    end

    it "/a/b/c → /a/b/x で c 配下の葉 (d,e,f,g) のみ移り、y 配下 (z,0,1,2) は全カラム無変更" do
      expect_only_prefix_rewrite(from: "/a/b/c", to: "/a/b/x") do
        described_class.rename!(folder_path: "/a/b/c", new_name: "x", actor: a)
      end

      # スナップショット突合に加え、結果のパス集合も明示しておく (仕様の読み物として)
      expect(Photo.where("folder_path LIKE ?", "/a/%").pluck(:folder_path)).to contain_exactly(
        "/a/b/x/d", "/a/b/x/e", "/a/b/x/f", "/a/b/x/g",
        "/a/b/y/z", "/a/b/y/0", "/a/b/y/1", "/a/b/y/2"
      )
    end
  end

  describe "LIKE メタ文字を含むフォルダ名" do
    before do
      photo!(a, "/割引_50%", "m1.jpg")
      photo!(a, "/割引_50%/内訳", "m2.jpg")
      photo!(a, "/割引X50%", "m3.jpg") # LIKE の _ がワイルドカード扱いだと巻き込まれる名前
      FolderOwner.create!(folder_path: "/割引_50%", user: a)
      FolderOwner.create!(folder_path: "/割引X50%", user: a)
    end

    it "_ / % をリテラルとして扱い、似た名前の兄弟を巻き込まない" do
      described_class.rename!(folder_path: "/割引_50%", new_name: "特価", actor: a)

      expect(Photo.pluck(:folder_path)).to contain_exactly(
        "/特価", "/特価/内訳", "/割引X50%",
        "/旅行/京都", "/旅行/京都/寺", "/旅行/京都", "/旅行/京"
      )
    end

    it "衝突判定も _ / % をリテラル比較する (誤検知で拒否しない)" do
      expect(
        described_class.rename!(folder_path: "/旅行/京都", new_name: "割引_99%", actor: a)
      ).to eq("/旅行/割引_99%")
    end
  end

  it "不正な名前とルートは InvalidName" do
    [ "", "  ", "a/b", ".." ].each do |bad|
      expect {
        described_class.rename!(folder_path: "/旅行/京都", new_name: bad, actor: a)
      }.to raise_error(described_class::InvalidName)
    end
    expect {
      described_class.rename!(folder_path: "/", new_name: "x", actor: admin)
    }.to raise_error(described_class::InvalidName)
  end
end
