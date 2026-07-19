require "rails_helper"

RSpec.describe ShareLink do
  describe ".generate_token" do
    it "22文字の base62 を生成する (ADR-008)" do
      token = described_class.generate_token
      expect(token).to match(/\A[0-9a-zA-Z]{22}\z/)
    end

    it "毎回異なる" do
      expect(described_class.generate_token).not_to eq(described_class.generate_token)
    end
  end

  describe "#active?" do
    it "revoked_at が立つと無効になる（台帳からは消えない, ADR-018）" do
      user = User.create!(name: "a", nickname: "a", role: "user", status: "approved")
      link = described_class.create!(
        token: described_class.generate_token, folder_path: "/x",
        issued_by: user, issued_at: Time.current
      )
      expect(link.active?).to be true
      link.update!(revoked_at: Time.current, revoked_by: user, revoked_reason: "manual")
      expect(link.active?).to be false
      expect(described_class.count).to eq(1)
    end
  end
end
