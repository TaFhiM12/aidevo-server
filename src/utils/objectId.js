import { ObjectId } from "mongodb";
import ApiError from "./ApiError.js";

export const isValidObjectId = (value) => {
  return ObjectId.isValid(value);
};

export const toObjectId = (value, fieldName = "ID") => {
  if (!ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return new ObjectId(value);
};