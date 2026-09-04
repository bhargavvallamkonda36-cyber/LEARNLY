import React from "react";
import "../styles/LectureVideo.css";

/*
  ============================================================
  LEARNLY - PHASE 5
  YouTube Learning Video Integration
  ============================================================

  Source:
  Bro Code - Java Full Course 2025

  Video:
  https://www.youtube.com/watch?v=xTtL8E4LzTQ

  We use timestamps so each LMS module opens at the
  correct part of the full Java course.
  ============================================================
*/

const YOUTUBE_VIDEO_ID = "xTtL8E4LzTQ";

/*
  ============================================================
  10 MODULE VIDEO MAPPING
  ============================================================

  start = starting timestamp in seconds

  These timestamps come from the official video description.
*/

const MODULE_VIDEOS = {
  1: {
    title: "Introduction to Java",
    start: 0,
    topic: "Introduction, Java setup and first program",
  },

  2: {
    title: "Variables, Types & Operators",
    start: 658,
    topic: "Variables, user input and arithmetic",
  },

  3: {
    title: "Methods & Conditionals",
    start: 4140,
    topic: "If statements, switches and logical operators",
  },

  4: {
    title: "Loops & Arrays",
    start: 11983,
    topic: "While loops, for loops, arrays and 2D arrays",
  },

  5: {
    title: "Classes & Objects",
    start: 24107,
    topic: "Object-oriented programming, classes and constructors",
  },

  6: {
    title: "Inheritance & Polymorphism",
    start: 26644,
    topic: "Inheritance, overriding, abstraction and polymorphism",
  },

  7: {
    title: "Encapsulation & Interfaces",
    start: 29579,
    topic: "Getters, setters, interfaces, aggregation and composition",
  },

  8: {
    title: "Collections & Exceptions",
    start: 31517,
    topic: "Wrapper classes, ArrayLists and exception handling",
  },

  9: {
    title: "File Handling & Advanced Java",
    start: 33208,
    topic: "Files, dates, anonymous classes, generics, HashMaps and enums",
  },

  10: {
    title: "Multithreading & Final Concepts",
    start: 40365,
    topic: "Threading, multithreading and final project",
  },
};


/*
  ============================================================
  CONVERT LECTURE NUMBER
  ============================================================
*/

function getModuleNumber({
  moduleNumber,
  module,
  lectureNumber,
}) {
  if (moduleNumber) {
    const number = Number(moduleNumber);

    if (
      Number.isInteger(number) &&
      MODULE_VIDEOS[number]
    ) {
      return number;
    }
  }

  if (lectureNumber) {
    const number = Number(lectureNumber);

    if (
      Number.isInteger(number) &&
      MODULE_VIDEOS[number]
    ) {
      return number;
    }
  }

  if (typeof module === "string") {
    const match = module.match(/\d+/);

    if (match) {
      const number = Number(match[0]);

      if (MODULE_VIDEOS[number]) {
        return number;
      }
    }
  }

  return 1;
}


/*
  ============================================================
  COMPONENT
  ============================================================
*/

export default function LectureVideo({
  moduleNumber,
  lectureNumber,
  module,
  title,
}) {
  const currentModule =
    getModuleNumber({
      moduleNumber,
      lectureNumber,
      module,
    });

  const video =
    MODULE_VIDEOS[currentModule] ||
    MODULE_VIDEOS[1];

  const embedUrl =
    `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}` +
    `?start=${video.start}` +
    `&rel=0` +
    `&modestbranding=1` +
    `&playsinline=1`;

  return (
    <div className="lecture-video-wrapper">

      <div className="lecture-video-header">

        <div>
          <span className="lecture-video-label">
            LEARNING VIDEO
          </span>

          <h3>
            {title || video.title}
          </h3>

          <p>
            {video.topic}
          </p>
        </div>

        <div className="youtube-badge">
          YouTube
        </div>

      </div>


      <div className="lecture-video-player">

        <iframe
          src={embedUrl}
          title={`Learnly - ${video.title}`}
          frameBorder="0"
          allow="
            accelerometer;
            autoplay;
            clipboard-write;
            encrypted-media;
            gyroscope;
            picture-in-picture;
            web-share
          "
          allowFullScreen
        />

      </div>


      <div className="lecture-video-info">

        <div>
          <span className="info-label">
            COURSE VIDEO
          </span>

          <strong>
            Bro Code — Java Full Course
          </strong>
        </div>


        <div>
          <span className="info-label">
            MODULE
          </span>

          <strong>
            Module {currentModule} of 10
          </strong>
        </div>


        <div>
          <span className="info-label">
            TOPIC
          </span>

          <strong>
            {video.title}
          </strong>
        </div>

      </div>

    </div>
  );
}
