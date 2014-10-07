class EmployeesController < ApplicationController
  def index
  end

  def show
    id = params[:id]
    @employee = Employee.find_by_id(id)
    @photos   = Photo.where(employee_id: id)
  end
end
