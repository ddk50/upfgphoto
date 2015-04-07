# -*- coding: utf-8 -*-

module AdminHelper

  def employee_authority(employee)
    
  end

  def status_label(status)
    case status
    when 'accepted'
str = <<"EOS"
<option data-content="<span class='label label-success'>許可</span>">許可</option>
EOS
    when 'pending'
str = <<"EOS"
<option data-content="<span class='label label-warning'>保留</span>">保留</option>
EOS
    when 'declined'
str = <<"EOS"
<option data-content="<span class='label label-danger'>禁止</span>">禁止</option>
EOS
    end
  end
  
end
