require "rails_helper"

RSpec.describe "GET /api/v1/stats (アップロード統計)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }

  def photo!(user, file, deleted_at: nil)
    Photo.create!(user: user, folder_path: "/x", file_name: file, title: file,
                  taken_at: Time.current, deleted_at: deleted_at)
  end

  it "ユーザ別の枚数を多い順に返す (ゴミ箱内は数えない)" do
    3.times { |i| photo!(a, "a#{i}.jpg") }
    photo!(b, "b1.jpg")
    photo!(b, "b2.jpg", deleted_at: Time.current) # trashed は除外

    login_as(a)
    get "/api/v1/stats"

    body = response.parsed_body
    expect(body["total_photos"]).to eq(4)
    expect(body["uploaders"].map { |u| [ u["name"], u["count"] ] }).to eq([ [ "A", 3 ], [ "B", 1 ] ])
  end

  it "未ログインは 401" do
    get "/api/v1/stats"
    expect(response).to have_http_status(:unauthorized)
  end
end
