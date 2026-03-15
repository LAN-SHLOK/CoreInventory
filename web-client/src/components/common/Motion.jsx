import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'



/**
 * CustomDropdown - Premium high-fidelity dropdown for forms.
 */
export const CustomDropdown = ({ icon, value, setter, options, placeholder, fullWidth = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.id === value || opt.id === Number(value) || opt.id === String(value))

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'min-w-[170px] flex-1 sm:flex-initial'}`}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input pl-10 pr-4 h-11 text-[11px] font-bold flex items-center justify-between transition-all hover:theme-bg-surface-active cursor-pointer w-full text-left uppercase tracking-wider group border-white/5 shadow-lg"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`absolute left-3.5 transition-colors duration-300 ${isOpen ? 'text-emerald-500' : 'theme-text-faint group-hover:theme-text'}`}>
            {icon}
          </div>
          <span className={`truncate ${value ? 'theme-text' : 'theme-text-faint'}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown size={14} className={`theme-text-faint transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-full left-0 right-0 mt-2 p-1.5 theme-bg-surface border theme-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[70] min-w-full backdrop-blur-xl bg-opacity-95"
            >
              <div 
                onClick={() => { setter(''); setIsOpen(false) }}
                className="px-4 py-2.5 rounded-xl text-[11px] font-bold theme-text-faint hover:theme-bg-active hover:theme-text cursor-pointer transition-all uppercase tracking-widest mb-1"
              >
                {placeholder}
              </div>
              <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {options.map(opt => (
                  <motion.div 
                    key={opt.id}
                    whileHover={{ x: 4 }}
                    onClick={() => { setter(opt.id); setIsOpen(false) }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                      (value === opt.id || Number(value) === opt.id || String(value) === String(opt.id))
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'theme-text hover:theme-bg-active hover:theme-text-secondary border border-transparent'
                    }`}
                  >
                    <span className="truncate pr-4">{opt.name}</span>
                    {(value === opt.id || Number(value) === opt.id || String(value) === String(opt.id)) && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0" />}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * AnimatedCard - A wrapper for cards with smooth hover and entry animations.
 */
export const AnimatedCard = ({ children, className = '', delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    whileHover={onClick ? { y: -4, scale: 1.01, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : {}}
    whileTap={onClick ? { scale: 0.99 } : {}}
    onClick={onClick}
    className={`card ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </motion.div>
)

/**
 * SpringModal - High-fidelity modal wrapper with spring physics.
 */
export const SpringModal = ({ isOpen, onClose, title, subtitle, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex p-4 overflow-y-auto custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="theme-bg-surface border theme-border rounded-2xl w-full max-w-lg shadow-2xl relative z-[101] overflow-hidden m-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b theme-border">
          <div>
            <h2 className="text-sm font-semibold theme-text text-glow">{title}</h2>
            {subtitle && <p className="text-xs theme-text-faint mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="theme-text-muted hover:theme-text transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 bg-gray-500/5 border-t theme-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/**
 * StaggerContainer - Utility for staggered children animations
 */
export const StaggerContainer = ({ children, delay = 0, stagger = 0.05, className = '', component = 'div' }) => {
  const Component = component === 'div' ? motion.div : motion[component] || motion.div
  return (
    <Component
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          }
        }
      }}
      className={className}
    >
      {children}
    </Component>
  )
}

/**
 * StaggerItem - Child element for StaggerContainer
 */
export const StaggerItem = ({ children, className = '', component = 'div' }) => {
  const Component = component === 'div' ? motion.div : motion[component] || motion.div
  return (
    <Component
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
      }}
      className={className}
    >
      {children}
    </Component>
  )
}
