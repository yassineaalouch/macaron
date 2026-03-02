import { Schema, model, models } from "mongoose"
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true }, // sera haché
    role: { type: String, default: "user" }
  },
  { timestamps: true }
)

const User = models.User || model("User", UserSchema)
export default User
