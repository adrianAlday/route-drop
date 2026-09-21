import LoadingWrapper from "./_components/LoadingWrapper";
import "./globals.css";

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
