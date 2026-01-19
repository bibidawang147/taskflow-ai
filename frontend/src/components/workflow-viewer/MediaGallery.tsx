import { useState } from 'react'
import { Play, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import type { DemonstrationMedia } from '../../types/workflow'

interface MediaGalleryProps {
  media: DemonstrationMedia[]
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (media.length === 0) {
    return null
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1))
  }

  const currentMedia = media[currentIndex]

  return (
    <>
      <div className="media-gallery">
        {media.map((item, index) => (
          <div
            key={index}
            className="media-gallery-item"
            onClick={() => openLightbox(index)}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.caption || `演示图片 ${index + 1}`}
                className="media-gallery-image"
              />
            ) : (
              <div className="media-gallery-video-thumbnail">
                <Play className="w-8 h-8" />
                <span>视频</span>
              </div>
            )}
            {item.caption && (
              <div className="media-gallery-caption">{item.caption}</div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox 弹窗 */}
      {lightboxOpen && (
        <div className="media-lightbox" onClick={closeLightbox}>
          <div
            className="media-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="media-lightbox-close"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
            </button>

            {media.length > 1 && (
              <>
                <button
                  className="media-lightbox-nav media-lightbox-prev"
                  onClick={goToPrev}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="media-lightbox-nav media-lightbox-next"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <div className="media-lightbox-media">
              {currentMedia.type === 'image' ? (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.caption || '演示图片'}
                />
              ) : (
                <video
                  src={currentMedia.url}
                  controls
                  autoPlay
                  className="media-lightbox-video"
                />
              )}
            </div>

            {currentMedia.caption && (
              <div className="media-lightbox-caption">
                {currentMedia.caption}
              </div>
            )}

            {media.length > 1 && (
              <div className="media-lightbox-counter">
                {currentIndex + 1} / {media.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
