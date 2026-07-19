require "rails_helper"

RSpec.describe User do
  describe ".find_by_identity" do
    it "Twitter UID / Google sub のどちらからでも同じ user に解決する (ADR-020)" do
      user = described_class.create!(name: "和", nickname: "kaz", role: "user", status: "approved")
      user.identities.create!(provider: "twitter", uid: "12345")
      user.identities.create!(provider: "google_oauth2", uid: "110248495921238986420")

      expect(described_class.find_by_identity(provider: "twitter", uid: "12345")).to eq(user)
      expect(described_class.find_by_identity(provider: "google_oauth2", uid: "110248495921238986420")).to eq(user)
      expect(described_class.find_by_identity(provider: "google_oauth2", uid: "unknown")).to be_nil
    end

    it "google identity を持たない Twitter-only ユーザも解決できる（未移行ユーザの資産保持）" do
      legacy = described_class.create!(name: "旧", nickname: "old", role: "user", status: "approved")
      legacy.identities.create!(provider: "twitter2", uid: "99999")

      expect(described_class.find_by_identity(provider: "twitter2", uid: "99999")).to eq(legacy)
    end
  end
end
