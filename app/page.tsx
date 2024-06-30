import { MainCanvas } from "@/components/MainCanvas";
import { NavBar } from "@/components/Navbar";
import { LayerListSidebar } from "@/components/LayerListSidebar";
import { EditLayerSidebar } from "@/components/EditLayerSidebar";
import { AnimationProvider } from "@/lib/hooks/useAnimation";

export default function Home() {
  return (
    <AnimationProvider>
      <div className="flex h-screen w-full flex-col">
        <NavBar />
        <div className="flex flex-1">
          <LayerListSidebar />
          <MainCanvas />
          <EditLayerSidebar />
        </div>
      </div>
    </AnimationProvider>
  );
}
