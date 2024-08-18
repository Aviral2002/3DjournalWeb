import { atom, useAtom} from "jotai";
import { useEffect } from "react";

const pictures = [
  'pic1',
  'paper',
  'paper',
  'paper',
  'paper',
  'paper',
  'paper',
];

export const pageAtom = atom(0);
export const pages = [
  {
    front: "book-cover",
    back: pictures[0],
  },
];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back",
});

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  return (
    <>
      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
        <a
          className="pointer-events-auto mt-10 ml-10"
          href="https://thatsphilosophical.substack.com/p/absurdism-your-guide-to-navigating"
        >
          <img className="w-20 border-2 border-red-200 rounded-full" src="/images/Punishment_sisyph.jpg" />


        </a>
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
            {[...pages].map((_, index) => (
              <button
                key={index}
                className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                  index === page
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white"
                }`}
                onClick={() => setPage(index)}
              >
                {index === 0 ? "Cover" : `Page ${index}`}
              </button>
            ))}
            <button
              className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                page === pages.length
                  ? "bg-white/90 text-black"
                  : "bg-black/30 text-white"
              }`}
              onClick={() => setPage(pages.length)}
            >
              Back Cover
            </button>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 flex justify-center -rotate-2 select-none ">
        <div className="relative">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-8 w-max px-8">
          <h1 className="shrink-0 text-brown text-10xl font-black ">
              The
            </h1>
            <h2 className="shrink-0 text-brown text-8xl italic font-light">
              struggle
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-bold">
              itself
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              towards
            </h2>
            <h2 className="shrink-0 text-brown text-10xl font-medium">
              the
            </h2>
            <h2 className="shrink-0 text-brown text-8xl font-medium">
              height
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-medium">
              is
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              enough
            </h2>
            <h2 className="shrink-0 text-brown text-10xl font-medium">
              to
            </h2>
            <h2 className="shrink-0 text-brown text-8xl font-medium">
              fill
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-medium">
              a
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              man's
            </h2>
            <h2 className="shrink-0 text-brown text-9xl font-medium">
              heart.
            </h2>
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-8 px-8 w-max">
          <h1 className="shrink-0 text-brown text-10xl font-black ">
              The
            </h1>
            <h2 className="shrink-0 text-brown text-8xl italic font-light">
              struggle
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-bold">
              itself
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              towards
            </h2>
            <h2 className="shrink-0 text-brown text-10xl font-medium">
              the
            </h2>
            <h2 className="shrink-0 text-brown text-8xl font-medium">
              height
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-medium">
              is
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              enough
            </h2>
            <h2 className="shrink-0 text-brown text-10xl font-medium">
              to
            </h2>
            <h2 className="shrink-0 text-brown text-8xl font-medium">
              fill
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-medium">
              a
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              man's
            </h2>
            <h2 className="shrink-0 text-brown text-9xl font-medium">
              heart.
            </h2>
          </div>
        </div>
        <div className="absolute top-2/4">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-8 w-max px-8">
            <h1 className="shrink-0 text-brown text-10xl font-black ">
              One
            </h1>
            <h2 className="shrink-0 text-brown text-8xl italic font-light">
              Must
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-bold">
              Imagine
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              Sisyphus
            </h2>
            <h2 className="shrink-0 text-brown text-9xl font-medium">
              Happy.
            </h2>
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-8 px-8 w-max">
            <h1 className="shrink-0 text-brown text-10xl font-black ">
              One
            </h1>
            <h2 className="shrink-0 text-brown text-8xl italic font-light">
              Must
            </h2>
            <h2 className="shrink-0 text-brown text-12xl font-bold">
              Imagine
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              Sisyphus
            </h2>
            <h2 className="shrink-0 text-brown text-9xl font-medium">
              Happy.
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};
