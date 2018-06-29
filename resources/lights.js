function DirectionalLight(position_x, position_y, course, angle_of_view, near, far) {
    var radian_angle_of_view = angle_of_view * Math.PI / 180;
    var right = Math.tan(radian_angle_of_view / 2) * far;
    var left = -right;
    this.position_x = position_x;
    this.position_y = position_y;
    this.course = course;  // course is in degrees. If course = 0, than light is oriented as y-axis
    this.left = left;
    this.right = right;
    this.near = near;
    this.far = far;
}

DirectionalLight.prototype.create_frustum_matrix = function () {
    var rotation = matrix.rotation_2d(-this.course * Math.PI / 180);
    var translation = matrix.translation_2d(-this.position_x, -this.position_y);
    var res = matrix.dot(matrix.frustum_2d(this.left, this.right, this.near, this.far), rotation);
    return matrix.dot(res, translation);
};

DirectionalLight.prototype.copy = function () {
    var new_light = new DirectionalLight(this.position_x, this.position_y, this.course, 0, this.near, this.far);
    new_light.left = this.left;
    new_light.right = this.right;
    return new_light;
};