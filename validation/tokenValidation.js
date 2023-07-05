import jwt from "jsonwebtoken";
const tokenValidation = (req, res, next) => {
    let token = req.get('authorization');
    if(token){
        token = token.slice(7);
        try {
            jwt.verify(token, process.env.JWT_TOKEN);
        } catch (err) {
            return res.json({
                status: 401,
                error: err.message
            });
        }
        return next();
    }else{
        return res.json({
            status: 404,
            error: "Access denied! Unauthorized user"
        });
    }
}
export default tokenValidation;