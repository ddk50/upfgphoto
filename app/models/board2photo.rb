
class Board2photo < ActiveRecord::Base
  include Search
  
  belongs_to :photo
  belongs_to :board 

  default_scope { includes(:photo) }
  default_scope { includes(:board) }

end
