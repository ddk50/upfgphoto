class EmployeesController < ApplicationController
  def index
  end

  def show
    @photos = Photo.where(employee_id: current_employee.id)
  end
end
