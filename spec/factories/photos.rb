
FactoryGirl.define do
  
  factory :employee do
    provider 'twitter'
    sequence(:uid) { |i| "uid#{i}" }
    sequence(:nickname) { |i| "nickname#{i}" }
    sequence(:image_url) { |i| "http://example.com/image#{i}.jpg" }
    sequence(:description) { |i| "test user #{i}" }
    sequence(:name) { |i| "name#{i}" }
    
    factory :user do
    end
  end

  factory :photo do
    employee
    sequence(:filepath) {|i| "#{i}.jpg" }
    shotdate Time.now.to_datetime
    model 'Canon 5d markII'
    exposure_time '1/256'
    f_number '4.0'
    focal_length "35"
    focal_length_in_35mm_film "35"
    iso_speed_ratings "100"
    update_date_time Time.now.to_datetime
  end

  factory :tag do
    sequence(:name) {|i| "tagname#{i}" }
  end

  factory :tag2photo do
    tag
    photo
  end

end

