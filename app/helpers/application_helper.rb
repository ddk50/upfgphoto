module ApplicationHelper
  def gsub_enter(text)
    text.gsub(/\n/, '<br />').html_safe
  end

  def gsub_http_to_https(url)
    url.gsub(/http:\/\//, 'https://')
  end
end
