namespace :admin do
  desc "ブートストラップ: pending user の google identity を既存ユーザへ紐付ける (PENDING_ID / TARGET_ID)
        最初の admin は自分を承認できないため、初回移行時はこのタスクで自分自身を紐付ける"
  task link_google: :environment do
    pending = User.pending.find(ENV.fetch("PENDING_ID"))
    target = User.find(ENV.fetch("TARGET_ID"))
    IdentityLinker.link!(pending_user: pending, target_user: target)
    puts "linked: google identity -> #{target.nickname} (id=#{target.id})"
  end
end
