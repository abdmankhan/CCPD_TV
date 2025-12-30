import { useState, useRef, useEffect } from "react";
import GridLayout from "react-grid-layout";
import api from "../services/api";
import { BACKEND_URL } from "../config";
import { socket } from "../services/socket";
import { getRole } from "../utils/auth";

import Announcements from "./widgets/Announcements";
import Drives from "./widgets/Drives";
import Spotlight from "./widgets/Spotlight";
import Stats from "./widgets/Stats";
import PdfSlideshow from "./widgets/PdfSlideshow";
import YoutubePlayer from "./widgets/YoutubePlayer";
import MediaSlideshow from "./widgets/MediaPlaylistEditor";
import BackgroundMusic from "./widgets/BackgroundMusic";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const WIDGETS = {
  announcements: Announcements,
  drives: Drives,
  spotlight: Spotlight,
  stats: Stats,
  pdfslideshow: PdfSlideshow,
  youtube: YoutubePlayer,
  mediaSlideshow: MediaSlideshow,
};

const WIDGET_LABELS = {
  announcements: "📢 Announcements",
  drives: "📅 Placement Drives",
  spotlight: "⭐ Company Spotlight",
  stats: "📊 Placement Statistics",
  pdfslideshow: "📄 PDF Slideshow",
  youtube: "🎥 Video Player",
  mediaSlideshow: "🖼️ Media Slideshow",
};

// Layout templates
const LAYOUT_TEMPLATES = {
  single: [
    { i: 'slot-1', x: 0, y: 0, w: 12, h: 6, static: true }
  ],
  double: [
    { i: 'slot-1', x: 0, y: 0, w: 6, h: 6, static: true },
    { i: 'slot-2', x: 6, y: 0, w: 6, h: 6, static: true }
  ],
  quad: [
    { i: 'slot-1', x: 0, y: 0, w: 6, h: 3, static: true },
    { i: 'slot-2', x: 6, y: 0, w: 6, h: 3, static: true },
    { i: 'slot-3', x: 0, y: 3, w: 6, h: 3, static: true },
    { i: 'slot-4', x: 6, y: 3, w: 6, h: 3, static: true }
  ]
};

function LayoutEditor({initialState}) {
  const [layoutTemplate, setLayoutTemplate] = useState(null); // null, 'single', 'double', 'quad', 'custom'
  const [layout, setLayout] = useState([]);
  const [widgetSlots, setWidgetSlots] = useState({}); // Maps slot-id to widget type
  const [showWidgetSelector, setShowWidgetSelector] = useState(null); // Which slot is being configured
  const hasInitialized = useRef(false);

  const role = getRole();
  const isEditor = role === "EDITOR";

  useEffect(() => {
    if (initialState?.layout && !hasInitialized.current) {
      // Check if initialState has template info
      if (initialState.layoutTemplate) {
        setLayoutTemplate(initialState.layoutTemplate);
        setWidgetSlots(initialState.widgetSlots || {});
      } else {
        // Legacy: if no template, assume custom
        setLayoutTemplate('custom');
      }
      setLayout(initialState.layout);
      hasInitialized.current = true;
    }
  }, [initialState]);

  useEffect(() => {
    socket.on("INIT_STATE", (state) => {
      if (state.layout) {
        setLayout(state.layout);
        if (state.layoutTemplate) {
          setLayoutTemplate(state.layoutTemplate);
          setWidgetSlots(state.widgetSlots || {});
        }
      }
    });

    return () => {
      socket.off("INIT_STATE");
      socket.off("DASHBOARD_UPDATE");
    };
  }, []);

  const canvasRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        setGridWidth(canvasRef.current.offsetWidth);
        setGridHeight(canvasRef.current.offsetHeight);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Also update when layoutTemplate changes
    if (layoutTemplate) {
      setTimeout(updateDimensions, 50);
    }
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [layoutTemplate]);

  useEffect(() => {
    const handleUpdate = (state) => {
      if (state && typeof state === 'object') {
        // Update layout info if present (could be empty array)
        if ('layout' in state) {
          setLayout(state.layout || []);
        }
        if ('layoutTemplate' in state) {
          setLayoutTemplate(state.layoutTemplate);
        }
        if ('widgetSlots' in state) {
          setWidgetSlots(state.widgetSlots || {});
        }
      }
    };

    socket.on("DASHBOARD_UPDATE", handleUpdate);

    return () => {
      socket.off("DASHBOARD_UPDATE", handleUpdate);
    };
  }, []);

  const selectLayoutTemplate = (template) => {
    setLayoutTemplate(template);
    setWidgetSlots({});
    if (template === 'custom') {
      setLayout([]);
    } else {
      setLayout(LAYOUT_TEMPLATES[template]);
    }
    
    // Update dimensions after template is selected
    setTimeout(() => {
      if (canvasRef.current) {
        setGridWidth(canvasRef.current.offsetWidth);
        setGridHeight(canvasRef.current.offsetHeight);
      }
    }, 100);
  };

  const assignWidgetToSlot = (slotId, widgetType) => {
    setWidgetSlots(prev => ({
      ...prev,
      [slotId]: widgetType
    }));
    setShowWidgetSelector(null);
  };

  const removeWidgetFromSlot = (slotId) => {
    setWidgetSlots(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
  };

  const isWidgetAdded = (type) => {
    if (layoutTemplate === 'custom') {
      return layout.some((item) => item.i.startsWith(type + "-"));
    } else {
      // Check if widget is already assigned to any slot
      return Object.values(widgetSlots).includes(type);
    }
  };

  const addWidget = (type) => {
    if (layoutTemplate !== 'custom') return; // Only for custom layout
    if (isWidgetAdded(type)) return;

    setLayout((prev) => [
      ...prev,
      {
        i: `${type}-${Date.now()}`,
        x: 0,
        y: 0,
        w: 4,
        h: 2,
      },
    ]);
  };

  const removeWidget = (id) => {
    setLayout((prev) => prev.filter((item) => item.i !== id));
  };

  const pushToTV = async () => {
    try {
      await api.post(`${BACKEND_URL}/update-layout`, { 
        layout,
        layoutTemplate,
        widgetSlots
      });
      alert("Layout pushed to TV");
    } catch (error) {
      alert("Failed to push layout");
    }
  };

  const handleLayoutChange = (newLayout) => {
    setLayout((prev) => {
      // Prevent unnecessary re-renders
      if (JSON.stringify(prev) === JSON.stringify(newLayout)) {
        return prev;
      }
      return newLayout;
    });
  };

  const clearWidgets = async () => {
    setLoading(true);
    setMsg("");

    try {
      setLayout([]);
      setWidgetSlots({});
      setLayoutTemplate(null);
      await api.post(`${BACKEND_URL}/clear-widgets`);
      setMsg("All widgets cleared");
    } catch {
      setMsg("Failed to clear widgets");
    } finally {
      setLoading(false);
    }
  };

  // Layout selection screen
  if (!layoutTemplate) {
    return (
      <div className="admin" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        background: '#020617'
      }}>
        <div style={{
          background: '#0f172a',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          border: '1px solid #1e293b',
          maxWidth: '600px',
          width: '90%'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#e5e7eb' }}>
            Select Layout Template
          </h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <button
              onClick={() => selectLayoutTemplate('single')}
              style={{
                padding: '20px',
                fontSize: '18px',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3b82f6';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#e5e7eb';
              }}
            >
              📱 1 Component (Full Screen)
            </button>
            <button
              onClick={() => selectLayoutTemplate('double')}
              style={{
                padding: '20px',
                fontSize: '18px',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3b82f6';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#e5e7eb';
              }}
            >
              📊 2 Components (Split View)
            </button>
            <button
              onClick={() => selectLayoutTemplate('quad')}
              style={{
                padding: '20px',
                fontSize: '18px',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3b82f6';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#e5e7eb';
              }}
            >
              🎯 4 Components (Quad View)
            </button>
            <button
              onClick={() => selectLayoutTemplate('custom')}
              style={{
                padding: '20px',
                fontSize: '18px',
                border: '2px solid #8b5cf6',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#8b5cf6';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#e5e7eb';
              }}
            >
              🎨 Custom Layout (Free Form)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="palette">
        <div className="palette-content">
          <h4>Layout: {layoutTemplate}</h4>
          <button
            onClick={() => {
              if (window.confirm("Change layout template? Current widgets will be cleared.")) {
                setLayoutTemplate(null);
                setLayout([]);
                setWidgetSlots({});
              }
            }}
            disabled={!isEditor}
            style={{ marginBottom: '15px', width: '100%' }}
          >
            🔄 Change Template
          </button>

          {layoutTemplate === 'custom' ? (
            <>
              <h4>Widgets</h4>
              {Object.keys(WIDGETS).map((key) => (
                <button
                  key={key}
                  onClick={() => isEditor && addWidget(key)}
                  disabled={isWidgetAdded(key) || !isEditor}
                  title={!isEditor ? "Read-only access" : isWidgetAdded(key) ? "Widget already added" : `Add ${WIDGET_LABELS[key]} widget`}
                >
                  {WIDGET_LABELS[key]}
                </button>
              ))}
            </>
          ) : (
            <>
              <h4>Assigned Widgets</h4>
              {layout.map((slot) => (
                <div key={slot.i} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{slot.i}</div>
                  {widgetSlots[slot.i] ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{WIDGET_LABELS[widgetSlots[slot.i]]}</span>
                      <button
                        onClick={() => isEditor && removeWidgetFromSlot(slot.i)}
                        disabled={!isEditor}
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => isEditor && setShowWidgetSelector(slot.i)}
                      disabled={!isEditor}
                      style={{ width: '100%' }}
                    >
                      + Assign Widget
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          <button
            className="push"
            onMouseDown={(e) => e.stopPropagation()}
            disabled={loading || !isEditor}
            onClick={isEditor && pushToTV}
            title={!isEditor ? "Read-only access" : "Upload layout to TV"}
          >
            🚀 Push to TV
          </button>
          <button
            className="clear"
            onClick={() => {
              if (!isEditor || loading) return;
              if (!window.confirm("Clear all widgets? This cannot be undone."))
                return;
              clearWidgets();
            }}
            disabled={loading || !isEditor}
            title={!isEditor ? "Read-only access" : "Clear all widgets from TV"}
          >
            🗑 Clear All Widgets
          </button>

          <div style={{ marginTop: "20px", borderTop: "2px solid #ddd", paddingTop: "15px" }}>
            <BackgroundMusic />
          </div>
        </div>
      </aside>

      {/* Widget Selector Modal */}
      {showWidgetSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0f172a',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#e5e7eb', marginTop: 0 }}>Select Widget for {showWidgetSelector}</h3>
            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              {Object.keys(WIDGETS).map((key) => (
                <button
                  key={key}
                  onClick={() => assignWidgetToSlot(showWidgetSelector, key)}
                  disabled={isWidgetAdded(key)}
                  style={{
                    padding: '12px',
                    border: '2px solid #3b82f6',
                    borderRadius: '6px',
                    background: isWidgetAdded(key) ? '#334155' : '#1e293b',
                    color: isWidgetAdded(key) ? '#94a3b8' : '#e5e7eb',
                    cursor: isWidgetAdded(key) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {WIDGET_LABELS[key]} {isWidgetAdded(key) ? '(already assigned)' : ''}
                </button>
              ))}
              <button
                onClick={() => setShowWidgetSelector(null)}
                style={{
                  padding: '12px',
                  marginTop: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANVAS */}
      <main className="canvas" ref={canvasRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GridLayout
          layout={layout}
          cols={12}
          rowHeight={gridHeight > 0 ? Math.floor((gridHeight - 32) / 6) : 60}
          width={gridWidth > 0 ? gridWidth - 32 : 1200}
          onLayoutChange={handleLayoutChange}
          isResizable={layoutTemplate === 'custom' && isEditor}
          isDraggable={layoutTemplate === 'custom' && isEditor}
          static={layoutTemplate !== 'custom' || !isEditor}
          compactType={null}
          verticalCompact={false}
          preventCollision={true}
          maxRows={6}
          isBounded={true}
          draggableHandle=".widget"
          draggableCancel=".delete-btn, button, textarea, input"
        >
          {layout.map((item) => {
            let type, Comp;
            
            if (layoutTemplate === 'custom') {
              // Custom layout: widget type is in the item id
              type = item.i.split("-")[0];
              Comp = WIDGETS[type];
            } else {
              // Template layout: widget type is in widgetSlots
              type = widgetSlots[item.i];
              Comp = type ? WIDGETS[type] : null;
            }

            return (
              <div 
                key={item.i} 
                className="widget"
                style={{
                  background: '#0f172a',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {layoutTemplate === 'custom' && (
                  <button
                    className="delete-btn"
                    onClick={() => isEditor && removeWidget(item.i)}
                    disabled={!isEditor}
                    title={!isEditor ? "Read-only access" : "Delete widget"}
                  >
                    ✕
                  </button>
                )}

                {Comp ? (
                  <Comp />
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#999',
                    padding: '20px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
                    <div>{item.i}</div>
                    <div style={{ fontSize: '12px' }}>No widget assigned</div>
                  </div>
                )}
              </div>
            );
          })}
        </GridLayout>
      </main>
    </div>
  );
}

export default LayoutEditor;
