import { createMemoryRouter } from "react-router";
import PrompterCAD from "./components/PrompterCAD";

export const router = createMemoryRouter([
  {
    path: "/",
    Component: PrompterCAD,
  },
]);
