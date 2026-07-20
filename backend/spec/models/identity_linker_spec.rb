require "rails_helper"

# ADR-020「すんなり移行」の実体。成功パスは admin_linking_spec (request) でも
# 検証済みなので、ここではガード群と原子性、email 上書きの境界を固定する
RSpec.describe IdentityLinker do
  let!(:legacy) do
    u = User.create!(name: "旧", nickname: "old", role: "user", status: "approved")
    u.identities.create!(provider: "twitter2", uid: "tw-1")
    u
  end
  let!(:pending) do
    u = User.create!(name: "新", nickname: "new", role: "user", status: "pending",
                     email: "new@example.com")
    u.identities.create!(provider: "google_oauth2", uid: "sub-1", email: "new@example.com")
    u
  end

  it "成功: google identity が移り、pending は消え、target を返す" do
    result = described_class.link!(pending_user: pending, target_user: legacy)

    expect(result).to eq(legacy)
    expect(legacy.identities.pluck(:provider)).to contain_exactly("twitter2", "google_oauth2")
    expect(User.exists?(pending.id)).to be false
    expect(legacy.reload.email).to eq("new@example.com")
  end

  it "target に既に email があれば上書きしない (Google 側の email はヒント扱い)" do
    legacy.update!(email: "old@example.com")

    described_class.link!(pending_user: pending, target_user: legacy)
    expect(legacy.reload.email).to eq("old@example.com")
  end

  describe "ガード (いずれも DB は 1 カラムも変わらない)" do
    def expect_error_and_no_changes(message_part, &block)
      before_state = snapshot
      expect(&block).to raise_error(IdentityLinker::Error, /#{message_part}/)
      expect(snapshot).to eq(before_state)
    end

    it "pending でないユーザは紐付けられない" do
      pending.update!(status: "approved")
      expect_error_and_no_changes("承認待ちユーザではありません") do
        described_class.link!(pending_user: pending, target_user: legacy)
      end
    end

    it "自分自身には紐付けられない" do
      expect_error_and_no_changes("自分自身には紐付けられません") do
        described_class.link!(pending_user: pending, target_user: pending)
      end
    end

    it "紐付け先が既に Google 連携済みなら拒否" do
      legacy.identities.create!(provider: "google_oauth2", uid: "sub-other")
      expect_error_and_no_changes("既に Google 連携済み") do
        described_class.link!(pending_user: pending, target_user: legacy)
      end
    end

    it "google identity を持たない pending は拒否" do
      pending.identities.destroy_all
      expect_error_and_no_changes("google identity がありません") do
        described_class.link!(pending_user: pending, target_user: legacy)
      end
    end
  end

  it "途中で失敗したら identity の付け替えごとロールバックする (原子性)" do
    allow_any_instance_of(User).to receive(:destroy!).and_raise(ActiveRecord::RecordNotDestroyed)

    expect {
      described_class.link!(pending_user: pending, target_user: legacy)
    }.to raise_error(ActiveRecord::RecordNotDestroyed)

    # google identity は pending 側に残ったまま (中途半端な移行状態にならない)
    expect(Identity.find_by(provider: "google_oauth2", uid: "sub-1").user_id).to eq(pending.id)
    expect(legacy.reload.identities.pluck(:provider)).to eq([ "twitter2" ])
    expect(User.exists?(pending.id)).to be true
  end
end
