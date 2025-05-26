import { signIn } from "@/auth";
import { Github } from "lucide-react";

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <button
        type="submit"
        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 flex items-center"
      >
        <Github className="w-4 h-4 mr-1" />
        Signin with GitHub
      </button>
    </form>
  );
}
