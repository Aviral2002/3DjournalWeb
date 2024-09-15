import { useCursor, useTexture, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import debounce from 'lodash.debounce';
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
  CanvasTexture,
  Texture
} from "three";
import * as THREE from 'three';
import { degToRad } from "three/src/math/MathUtils.js";
import { pageAtom, pages } from "./UI";
import { atom } from 'jotai';

const isEditingAtom = atom(false);
const selectedWritingPageAtom = atom(1);

const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");
const emissiveColor = new Color("orange");

const pageMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: "#111" }),
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: whiteColor }),
];

pages.forEach((page) => {
  useTexture.preload(`/textures/${page.front}.jpg`);
  useTexture.preload(`/textures/${page.back}.jpg`);
  useTexture.preload(`/textures/book-cover-roughness.jpg`);
});

const createTextTexture = (text) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 1024;
  context.fillStyle = 'rgba(255, 255, 255, 0.0)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "78px 'Brush Script MT', cursive";
  context.fillStyle = 'black';
  context.textAlign = "left";
  context.textBaseline = "top";
  const words = text.split(' ');
  let line = '';
  let y = 40;
  let maxWidth = canvas.width - 80;
  let isOverflowing = false;

  for (let word of words) {
    const testLine = line + word + ' ';
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth) {
      context.fillText(line, 40, y);
      line = word + ' ';
      y += 60;
      if (y > canvas.height - 60) {
        isOverflowing = true;
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (!isOverflowing) {
    context.fillText(line, 40, y);
  }
  return { texture: new CanvasTexture(canvas), isOverflowing };
};

const createCompositeTexture = (pageTexture, textTexture) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 1024;

  context.drawImage(pageTexture.image, 0, 0, canvas.width, canvas.height);

  if (textTexture) {
    context.drawImage(textTexture.image, 0, 0, canvas.width, canvas.height);
  }

  return new CanvasTexture(canvas);
};

const Page = ({ number, front, back, page, opened, bookClosed, ...props }) => {
  const [journalEntries, setJournalEntries] = useState(
    new Array(pages.length).fill("")
  );
  const [frontTexture, setFrontTexture] = useState(null);
  const [backTexture, setBackTexture] = useState(null);
  const [isEditing, setIsEditing] = useAtom(isEditingAtom);
  const [selectedWritingPage, setSelectedWritingPage] = useAtom(selectedWritingPageAtom);
  const [currentPage, setPage] = useAtom(pageAtom);

  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/${front}.jpg`,
    `/textures/${back}.jpg`,
    ...(number === 0 || number === pages.length - 1
      ? [`/textures/book-cover-roughness.jpg`]
      : []),
  ]);
  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;

  const updateTexture = useMemo(
    () =>
      debounce((text, pageNumber) => {
        const { texture: newTextTexture, isOverflowing } = createTextTexture(text);
        const newFrontTexture = createCompositeTexture(picture, newTextTexture);
        const newBackTexture = createCompositeTexture(picture2, newTextTexture);
        setFrontTexture(newFrontTexture);
        setBackTexture(newBackTexture);

        if (isOverflowing && pageNumber < pages.length - 1) {
          const nextPageText = text.split(' ').slice(100).join(' '); // Assume 100 words fit on a page
          setSelectedWritingPage(pageNumber + 1);
          setPage(pageNumber + 1);
          handleJournalChange({ target: { value: nextPageText } }, pageNumber + 1);
        }
      }, 100),
    [picture, picture2, setSelectedWritingPage, setPage]
  );

  const handleJournalChange = (e, pageNumber = number) => {
    const newJournalEntries = [...journalEntries];
    newJournalEntries[pageNumber] = e.target.value;
    setJournalEntries(newJournalEntries);
    updateTexture(e.target.value, pageNumber);
  };

  const handleJournalFocus = () => {
    setIsEditing(true);
  };

  const handleJournalBlur = () => {
    setIsEditing(false);
  };

  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: frontTexture || picture,
        ...(number === 0
          ? { roughnessMap: pictureRoughness }
          : { roughness: 0.5 }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: backTexture || picture2,
        ...(number === pages.length - 1
          ? { roughnessMap: pictureRoughness }
          : { roughness: 0.5 }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];

    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [frontTexture, backTexture, picture, picture2, pictureRoughness]);

  const [highlighted, setHighlighted] = useState(false);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }

    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }
    
    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.40) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });
  
  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={() => setHighlighted(true)}
      onPointerLeave={() => setHighlighted(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          setPage(opened ? number : number + 1);
          setHighlighted(false);
        }
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
      {number === selectedWritingPage && (
        <Html position={[0.01, 0.8, 0.01]} center>
          <textarea
            id = "journalEntry"
            value={journalEntries[number]}
            onChange={(e) => handleJournalChange(e, number)}
            onFocus={handleJournalFocus}
            onBlur={handleJournalBlur}
            style={{
              position: "relative",
              top: '300px',
              left: '5px',
              width: "20rem",
              height: "2rem",
              background: "#B9925E",
              color: "white",
              border: "1px solid black",
              fontFamily: "serif",
              fontSize: "14px",
              resize: "none",
            }}
          />
        </Html>
      )}
    </group>
  );
};

export const Book = ({ ...props }) => {
  const [page, setPage] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const [selectedWritingPage, setSelectedWritingPage] = useAtom(selectedWritingPageAtom);
  const [isEditing] = useAtom(isEditingAtom);

  useEffect(() => {
    if (isEditing) return;

    let timeout;
    const goToPage = () => {
      setDelayedPage((delayedPage) => {
        if (page === delayedPage) {
          return delayedPage;
        } else {
          timeout = setTimeout(
            () => {
              goToPage();
            },
            Math.abs(page - delayedPage) > 2 ? 50 : 150
          );
          if (page > delayedPage) {
            return delayedPage + 1;
          }
          if (page < delayedPage) {
            return delayedPage - 1;
          }
        }
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page, isEditing]);

  return (
    <group {...props} rotation-y={-Math.PI / 2}>
      <Html position={[0, 2, 0]}>
        <select 
          value={selectedWritingPage} 
          onChange={(e) => {
            const newPage = Number(e.target.value);
            setSelectedWritingPage(newPage);
            setPage(newPage);
          }}
          style={{
            position: 'absolute',
            top: '150px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '5px',
            fontSize: '12px',
            fontWeight: 'bold',
            background: "rgb(224, 193, 154)",
          }}
        >
          {pages.map((_, index) => (
            <option key={index} value={index}>Write on Page {index}</option>
          ))}
        </select>
      </Html>
      {pages.map((pageData, index) => (
        <Page
          key={index}
          page={delayedPage}
          number={index}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
          {...pageData}
        />
      ))}
    </group>
  );
};