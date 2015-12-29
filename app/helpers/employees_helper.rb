module EmployeesHelper

  def get_tile_image(photoid)
    PHOTO_CONFIG['thumbnail_small_dir'] + "/thumbnail_#{photoid}.jpg"
  end

  def get_recent_photo_path_for_bio(employee)
    if employee.photos.last.present?
      return photo_thumbnail_url(id: employee.photos.last.id, type: "small")
    else
      return "/images/no_image.png"
    end
  end

end
