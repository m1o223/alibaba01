import { AboutPage } from "./AboutPage";
import { CartPage } from "./CartPage";
import { ContactPage } from "./ContactPage";
import { HomePage } from "./HomePage";
import { MenuPage } from "./MenuPage";
import { ErrorPage } from "../components/ErrorPage";

const pages = { "/": <HomePage />, "/about": <AboutPage />, "/cart": <CartPage />, "/contact": <ContactPage />, "/menu": <MenuPage /> };
export function pageForPath(path: string) { return pages[path as keyof typeof pages] ?? <ErrorPage kind="not-found" />; }
