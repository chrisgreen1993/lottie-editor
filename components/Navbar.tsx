import Link from "next/link";
import { Button } from "./ui/Button";
import { Link as LinkIcon } from "lucide-react";

export const NavBar = () => {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <span className="font-medium">Lottie Editor</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline">
          <LinkIcon className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </header>
  );
};
