module PhotoHelper
  def tag_cloud(tags, classes)
    max = tags.sort_by(&:count).last
    tags.each do |tag|
      index = tag.count.to_f / max.count * (classes.size - 1.0)
      yield(tag, classes[index.round])
    end
  end

  def gsub_enter(text)
    text.gsub(/\n/, '<br />').html_safe
  end
end
