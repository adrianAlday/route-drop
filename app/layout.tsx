import "./globals.css";

const Layout = ({ children }: LayoutProps<"/">) => {
  return (
    <html lang="en" className={"subpixel-antialiased"}>
      <body>{children}</body>
    </html>
  );
};

export default Layout;
