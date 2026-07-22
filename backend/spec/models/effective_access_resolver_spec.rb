require "rails_helper"

# 実効アクセス解決の中核 (ADR-005 継承=最近ルール勝ち / docs/API.md 可視性の原則)。
# ADR-026 の画像認可はこの visible_to? を土台にするため、単体で固定しておく。
#
# 可視性 (visible_to?) は「最も近い明示ルール勝ち」の純粋な判定であり、
# ADR-019 の「隷属」(=公開設定の編集権) とは別軸。よって restricted 配下に
# everyone 上書きがあればその部分木は可視になる (下の override ケースで固定)。
#
#   /pub               everyone (明示)
#   /r                 restricted (member 所属)
#   /r/sub             ルールなし → /r を継承
#   /r/open            everyone (上書き)
#   /r/open/deep       ルールなし → /r/open を継承
#   /g                 guest
RSpec.describe EffectiveAccessResolver do
  let!(:member)   { User.create!(name: "M", nickname: "m", role: "user", status: "approved") }
  let!(:outsider) { User.create!(name: "X", nickname: "x", role: "user", status: "approved") }
  let!(:admin)    { User.create!(name: "A", nickname: "adm", role: "admin", status: "approved") }

  before do
    r = AccessRule.create!(folder_path: "/r", mode: "restricted")
    AccessRuleMember.create!(access_rule: r, user: member)
    AccessRule.create!(folder_path: "/r/open", mode: "everyone")
    AccessRule.create!(folder_path: "/pub", mode: "everyone")
    AccessRule.create!(folder_path: "/g", mode: "guest")
  end

  # ルールは初期化時にメモリへ載るので、before の後に生成する
  subject(:resolver) { described_class.new }

  describe "#resolve (最も近い明示ルール)" do
    it "祖先にルールが無ければ nil (= ルートデフォルト everyone)" do
      expect(resolver.resolve("/none")).to be_nil
    end

    it "自パスの明示ルールを返す" do
      expect(resolver.resolve("/r").folder_path).to eq("/r")
    end

    it "ルールの無い子は最も近い祖先ルールを継承する" do
      expect(resolver.resolve("/r/sub").folder_path).to eq("/r")
    end

    it "より近い上書きルールが勝つ (root 側の restricted ではなく /r/open)" do
      expect(resolver.resolve("/r/open").folder_path).to eq("/r/open")
      expect(resolver.resolve("/r/open/deep").folder_path).to eq("/r/open")
    end
  end

  describe "#effective_mode" do
    it "ルール無しは everyone" do
      expect(resolver.effective_mode("/none")).to eq("everyone")
    end

    it "restricted は継承先でも restricted" do
      expect(resolver.effective_mode("/r")).to eq("restricted")
      expect(resolver.effective_mode("/r/sub")).to eq("restricted")
    end

    it "上書き everyone / guest がそのまま出る" do
      expect(resolver.effective_mode("/r/open")).to eq("everyone")
      expect(resolver.effective_mode("/r/open/deep")).to eq("everyone")
      expect(resolver.effective_mode("/g")).to eq("guest")
    end
  end

  describe "#visible_to?" do
    context "everyone / ルール無し / guest は誰でも可視" do
      it "非メンバーも nil ユーザも見える" do
        expect(resolver.visible_to?("/none", outsider)).to be(true)
        expect(resolver.visible_to?("/none", nil)).to be(true)
        expect(resolver.visible_to?("/pub", outsider)).to be(true)
        expect(resolver.visible_to?("/g", outsider)).to be(true)
        expect(resolver.visible_to?("/g", nil)).to be(true)
      end
    end

    context "restricted はメンバーと admin のみ" do
      it "メンバーは可視" do
        expect(resolver.visible_to?("/r", member)).to be(true)
      end

      it "★非メンバーは不可視 (ログイン済みでも)" do
        expect(resolver.visible_to?("/r", outsider)).to be(false)
      end

      it "未ログイン (nil) は不可視" do
        expect(resolver.visible_to?("/r", nil)).to be(false)
      end

      it "admin はメンバーでなくても可視 (ADR-006)" do
        expect(resolver.visible_to?("/r", admin)).to be(true)
      end

      it "ルールの無い子も restricted を継承して同じ判定" do
        expect(resolver.visible_to?("/r/sub", member)).to be(true)
        expect(resolver.visible_to?("/r/sub", outsider)).to be(false)
      end
    end

    context "restricted 配下の everyone 上書きは可視になる (隷属=編集権とは別軸)" do
      it "上書きフォルダとその子は非メンバーにも見える" do
        expect(resolver.visible_to?("/r/open", outsider)).to be(true)
        expect(resolver.visible_to?("/r/open/deep", outsider)).to be(true)
      end
    end
  end

  describe EffectiveAccessResolver::AllVisible do
    subject(:av) { described_class.new }

    it "内部の可視性判定を行わず常に可視 (ADR-009 ゲストリンク)" do
      expect(av.resolve("/r")).to be_nil
      expect(av.effective_mode("/r")).to eq("guest")
      expect(av.visible_to?("/r", nil)).to be(true)
      expect(av.visible_to?("/r", outsider)).to be(true)
    end
  end
end
