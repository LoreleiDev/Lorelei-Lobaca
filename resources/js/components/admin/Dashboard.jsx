import Sidebar from "./ui/Sidebar";

export default function Dashboard() {
    document.title = "Dashboard - Lobaca Admin";

    return (
        <Sidebar>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-foreground">
                    Dashboard Admin
                </h1>
            </div>
        </Sidebar>
    );
}
