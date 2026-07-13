import ExpenseRegister from "../../expenses/ExpenseRegister";
import type { Site } from "../../../services/sites";

export default function ExpensesTab({ site }: { site: Site }) {
  return <ExpenseRegister site={site} />;
}
