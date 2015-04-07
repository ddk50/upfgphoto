# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do

  factory :board do
    
    sequence(:caption) {|i| "captionname#{i}" }
    employee
    
    factory :board2photo do
      board
      photo
    end
    
  end
  
end

