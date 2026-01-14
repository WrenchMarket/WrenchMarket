import "@/styles/globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "WrenchMarket",
  description: "Запись в автосервисы и торги эвакуаторов"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="container">
          <Navbar />
          {children}
          <div className="hr" />
          <div className="small">
            © {new Date().getFullYear()} WrenchMarket · Политика конфиденциальности (заглушка)
          </div>
        </div>
      </body>
    </html>
  );
}
