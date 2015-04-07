# -*- coding: utf-8 -*-
module BoardsHelper

  def subscribed?(board)
    board.employees.any?{|employee| employee.id == current_employee.id}
  end

  def board_permission_badge(board)
    if board.guest
      return "<span class='badge alert-danger'>ゲストボード</span>".html_safe
    end

    if board.public
      return "<span class='badge alert-warning'>Publicボード</span>".html_safe
    end

    if board.specialized || subscribed?(board)
      return "<span class='badge alert-success'>購読済み</span>".html_safe
    end
    
    return "<span class='badge alert-info'>未購読</span>".html_safe
    
  end
end
