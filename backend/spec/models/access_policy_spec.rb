require "rails_helper"

# ADR-019「公開設定の編集権と隷属ルール」の実行可能な仕様書。
# frontend/src/lib/access.test.ts と同一のケース表（フォルダ構成・期待値を一致させること）。
#
#   /plain-a              owner A, ルールなし
#   /plain-b              owner B, ルールなし
#   /mine                 owner A, restricted (Aのゾーン)
#   /mine/sub             owner B  (Bが実体化したがAのゾーン内)
#   /foreign              owner B, restricted (Bのゾーン)
#   /foreign/sub          owner A  (Aが実体化したがBのゾーン内)
#   /foreign/open         owner B, everyone (Bによる上書き)
#   /foreign/open/deep    owner A  (everyone の下でも隷属は解除されない)
#   /nested               owner B, restricted
#   /nested/inner         owner C, restricted (ネストした他人restricted)
#   /nested/inner/leaf    owner A
RSpec.describe AccessPolicy do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:c) { User.create!(name: "C", nickname: "c", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "Adm", nickname: "adm", role: "admin", status: "approved") }

  before do
    {
      "/plain-a" => a, "/plain-b" => b,
      "/mine" => a, "/mine/sub" => b,
      "/foreign" => b, "/foreign/sub" => a,
      "/foreign/open" => b, "/foreign/open/deep" => a,
      "/nested" => b, "/nested/inner" => c, "/nested/inner/leaf" => a
    }.each { |path, owner| FolderOwner.create!(folder_path: path, user: owner) }

    AccessRule.create!(folder_path: "/mine", mode: "restricted")
    AccessRule.create!(folder_path: "/foreign", mode: "restricted")
    AccessRule.create!(folder_path: "/foreign/open", mode: "everyone")
    AccessRule.create!(folder_path: "/nested", mode: "restricted")
    AccessRule.create!(folder_path: "/nested/inner", mode: "restricted")
  end

  def can(path, user)
    described_class.can_edit_access?(path, user)
  end

  describe "ロール" do
    it "admin はどこでも編集できる（他人のネスト restricted 配下でも）" do
      expect(can("/nested/inner/leaf", admin)).to be true
      expect(can("/foreign", admin)).to be true
    end

    it "未ログイン (guest) はどこも編集できない" do
      expect(can("/plain-a", nil)).to be false
    end
  end

  describe "restricted 祖先がない通常空間" do
    it "フォルダのオーナーは編集できる" do
      expect(can("/plain-a", a)).to be true
    end

    it "オーナーでなければ編集できない" do
      expect(can("/plain-b", a)).to be false
    end

    it "オーナー未登録の中間フォルダは admin のみ" do
      expect(can("/no-owner-here", a)).to be false
      expect(can("/no-owner-here", admin)).to be true
    end
  end

  describe "自分の restricted ゾーン" do
    it "restricted の source フォルダ自身をオーナーは編集できる（自分のルールは外せる）" do
      expect(can("/mine", a)).to be true
    end

    it "ゾーンの主は、他人がオーナーのサブフォルダでも編集できる（子で上書き可）" do
      expect(can("/mine/sub", a)).to be true
    end
  end

  describe "他人の restricted への無条件隷属" do
    it "他人の restricted 配下では、サブフォルダのオーナーでも編集できない" do
      expect(can("/foreign/sub", a)).to be false
    end

    it "自分がオーナーのサブフォルダをゾーンの主(B)は編集できる" do
      expect(can("/foreign/sub", b)).to be true
    end

    it "間に everyone の上書きがあっても隷属は解除されない（無条件隷属の肝）" do
      expect(can("/foreign/open/deep", a)).to be false
    end

    it "ゾーン内の非オーナー(サブフォルダを実体化した人)は自分のゾーンでない場所を編集できない" do
      expect(can("/mine/sub", b)).to be false
    end
  end

  describe "ネストした他人の restricted" do
    it "A: 両方他人の restricted なので不可" do
      expect(can("/nested/inner/leaf", a)).to be false
    end

    it "B: 自分の /nested の下だが、他人(C)の /nested/inner が挟まるので不可" do
      expect(can("/nested/inner/leaf", b)).to be false
    end

    it "C: 自分の /nested/inner の下だが、他人(B)の /nested の配下なので不可" do
      expect(can("/nested/inner/leaf", c)).to be false
    end

    it "C は自分のルールの source (/nested/inner) すら外せない（Bのゾーン内のため）→ admin のみ" do
      expect(can("/nested/inner", c)).to be false
      expect(can("/nested/inner", admin)).to be true
    end
  end

  describe ".restricted_ancestor_sources" do
    it "自身を含む祖先の restricted source を根から順に返す" do
      expect(described_class.restricted_ancestor_sources("/nested/inner/leaf"))
        .to eq([ "/nested", "/nested/inner" ])
      expect(described_class.restricted_ancestor_sources("/mine")).to eq([ "/mine" ])
    end

    it "everyone の上書きは restricted の存在を隠さない" do
      expect(described_class.restricted_ancestor_sources("/foreign/open/deep")).to eq([ "/foreign" ])
    end

    it "restricted 祖先がなければ空" do
      expect(described_class.restricted_ancestor_sources("/plain-a")).to eq([])
    end
  end

  describe ".edit_blocker" do
    it "隷属ロックの源泉とオーナーを返す（UI の理由表示用）" do
      blocker = described_class.edit_blocker("/foreign/open/deep", a)
      expect(blocker[:folder_path]).to eq("/foreign")
      expect(blocker[:owner]).to eq(b)
    end

    it "ロックされていなければ nil" do
      expect(described_class.edit_blocker("/mine/sub", a)).to be_nil
      expect(described_class.edit_blocker("/plain-b", admin)).to be_nil
    end
  end
end
