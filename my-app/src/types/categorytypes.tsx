export type CategoryItem = {
  _id: string
  name: string
  status: "active" | "inactive";
  dueDate: string
}