
function allowRoles(...roles) {

    return function(req, res, next) {

        // Check whether user is logged in
        if (!req.session || !req.session.user) {

            return res.status(401).json({
                success: false,
                message: "Please login first"
            });

        }

        // Check user's role
        const userRole = req.session.user.role;

        if (!roles.includes(userRole)) {

            return res.status(403).json({
                success: false,
                message: "Access denied. You don't have permission."
            });

        }

        // User has permission
        next();

    };

}

module.exports = allowRoles;
