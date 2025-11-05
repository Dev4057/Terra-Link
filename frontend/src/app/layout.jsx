import "../styles/globals.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { WalletProvider } from "../context/WalletContext";

export const metadata = {
  title: "TerraLink Dashboard",
  description: "Manage land properties and escrows seamlessly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100">
        <WalletProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}