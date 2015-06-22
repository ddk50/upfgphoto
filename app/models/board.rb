class Board < ActiveRecord::Base
  belongs_to :employee
  
  has_many :board2photos, dependent: :destroy
  has_many :photos, through: :board2photos, dependent: :destroy

  has_many :board2employees, dependent: :destroy
  has_many :employees, through: :board2employees

  default_scope { includes(:employees) }  
  default_scope { includes(:board2employees) }

  def addnewmember(from, to)
    begin
      ActiveRecord::Base.transaction do    
        trans = Transaction.new(from_id: from,
                                to_id:   to,
                                status:  Transaction.statuses[:accepted])
        trans.save!
        
        b2e = Board2employee.new(employee_id:     to,
                                 board_id:        self.id,
                                 transaction_id:  trans.id)
        b2e.save!
      end
    rescue => e
      return false
    end
    return true
  end

  def self.like_tag(param)
    if param.present?
      return where(['caption like ?', "%#{param}%"])
    end
    all
  end  

  def self.delete_member_all_but_not_owner(board_id)
    board = Board.find_by_id(board_id)    
    if not board.nil?
      begin
        ActiveRecord::Base.transaction do    
          Board2employee.where(board_id: board_id).each{|b2e|
            if not b2e.employee_id == board.employee_id
              b2e.destroy
            end
          }
        end
      rescue => e
        return false
      end
      return true
    end
    return false
  end
  
end
