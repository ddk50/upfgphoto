require "rails_helper"

# N+1 回帰ガード: 一覧系エンドポイントのクエリ数が「データ件数」に比例しないこと。
# with_attached_image / 一括ロード / 窓関数化 (folder_query.rb ほか) を外すと
# ここが落ちる。
#
# 意図的に「絶対数」(このAPIは12クエリ、等) はアサートしない。絶対数は includes の
# 追加やスキーマ変更といった正当な修正でも揺れて偽陽性を量産するため。
# 「件数を増やしても同数」という相対形なら、落ちるのは本当に N+1 が再発したときだけ。
# (件数比例こそが N+1 の定義そのものでもある)
RSpec.describe "N+1 回帰 (クエリ数がデータ件数に比例しない)" do
  let!(:user) { User.create!(name: "U", nickname: "u", role: "user", status: "approved") }

  def photo_with_image!(path, file, taken_at: Time.current)
    p = Photo.create!(user: user, folder_path: path, file_name: file, title: file,
                      taken_at: taken_at)
    p.image.attach(io: StringIO.new("img-#{file}"), filename: file, content_type: "image/jpeg")
    p
  end

  before { login_as(user) }

  it "folders#show: 直下の写真が 3枚でも 30枚でもクエリ数は同じ" do
    photo_with_image!("/a/sub", "s.jpg") # 子フォルダを1つ固定
    3.times { |i| photo_with_image!("/a", "p#{i}.jpg") }
    q_small = count_queries { get "/api/v1/folders", params: { path: "/a" } }
    expect(response).to have_http_status(:ok)

    27.times { |i| photo_with_image!("/a", "q#{i}.jpg") }
    q_large = count_queries { get "/api/v1/folders", params: { path: "/a" } }

    expect(response.parsed_body["photos"].size).to eq(30)
    expect(q_large).to eq(q_small)
  end

  it "my_photos#index: フォルダ数が 2個でも 10個でもクエリ数は同じ" do
    2.times { |i| photo_with_image!("/f#{i}", "p.jpg") }
    q_small = count_queries { get "/api/v1/my_photos" }

    8.times { |i| photo_with_image!("/g#{i}", "p.jpg") }
    q_large = count_queries { get "/api/v1/my_photos" }

    expect(response.parsed_body["folders"].size).to eq(10)
    expect(q_large).to eq(q_small)
  end

  it "search#show: ヒットする写真が 3枚でも 30枚でもクエリ数は同じ" do
    # フォルダ名には一致させない語で写真スケーリングだけを分離する
    # (matching_folders はヒットフォルダごとに count が走る: 上限50の有界 N+1)
    3.times { |i| photo_with_image!("/lib", "空 #{i}.jpg") }
    q_small = count_queries { get "/api/v1/search", params: { q: "空" } }

    27.times { |i| photo_with_image!("/lib", "空 x#{i}.jpg") }
    q_large = count_queries { get "/api/v1/search", params: { q: "空" } }

    expect(response.parsed_body["photos"].size).to eq(30)
    expect(q_large).to eq(q_small)
  end
end
