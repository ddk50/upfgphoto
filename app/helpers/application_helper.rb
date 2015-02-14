module ApplicationHelper
  def gsub_enter(text)
    text.gsub(/\n/, '<br />').html_safe
  end
end
