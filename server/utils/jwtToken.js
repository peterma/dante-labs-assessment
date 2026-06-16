const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    };

    // Token is sent via HttpOnly cookie only — not in the response body.
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user,
    });
};

module.exports = sendToken;
