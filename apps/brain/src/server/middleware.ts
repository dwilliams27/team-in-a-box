import { AuthenticatedRequest } from "@brain/server/requests";
import { NextFunction, Response } from "express";

const checkBearerToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const bearerHeader = req.headers.get('authorization');
  
  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    
    if (bearerToken === process.env.BRAIN_SECRET_TOKEN) {
      req.token = bearerToken;
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
};
