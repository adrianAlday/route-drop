import "./globals.css";
import LoadingWrapper from "./_components/LoadingWrapper";

const Layout = ({ children }: LayoutProps<"/">) => {
  return (
    <html lang="en" className={"subpixel-antialiased"}>
      <body>
        <LoadingWrapper>{children}</LoadingWrapper>
      </body>
    </html>
  );
};

export default Layout;
