class Dashboard::GroupsController < Dashboard::ApplicationController
  def index
    @sort = params[:sort] || 'id_desc'

    @groups =
      if params[:parent_id] && Group.supports_nested_groups?
        parent = Group.find_by(id: params[:parent_id])

        if can?(current_user, :read_group, parent)
          GroupsFinder.new(current_user, parent: parent).execute
        else
          Group.none
        end
      else
        current_user.groups
      end

    @groups = @groups.search(params[:filter]) if params[:filter].present?
    @groups = @groups.includes(:route)
    @groups = @groups.sort(@sort)
    @groups = @groups.page(params[:page])

    respond_to do |format|
      format.html
      format.json do
        serializer = GroupChildSerializer.new(current_user: current_user)
                       .with_pagination(request, response)
        render json: serializer.represent(@groups)
      end
    end
  end
end
