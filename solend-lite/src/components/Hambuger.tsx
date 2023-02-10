import { isDrawerOpenAtom } from "stores/globalStates";
import { useAtom } from "jotai";
const Hambuger = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useAtom(isDrawerOpenAtom);

  const genericHamburgerLine = `h-1 w-6 my-1 rounded-full bg-primary-content transition ease transform duration-300`;

  return (
    <div
      className="flex flex-col h-12 w-12 justify-center items-center group"
      onClick={() => setIsDrawerOpen(!isDrawerOpen)}
    >
      <div
        className={`${genericHamburgerLine} ${
          isDrawerOpen
            ? "rotate-45 translate-y-1.5 opacity-50 group-hover:opacity-100"
            : "opacity-50 group-hover:opacity-100"
        }`}
      />

      <div
        className={`${genericHamburgerLine} ${
          isDrawerOpen
            ? "-rotate-45 -translate-y-1.5 opacity-50 group-hover:opacity-100"
            : "opacity-50 group-hover:opacity-100"
        }`}
      />
    </div>
  );
};
export default Hambuger;
