import React from 'react';
import './Card.css';

const Card = ({ card, isSelected, onClick, isMini = false, canRoll = false, onRoll }) => {
  const getTypeClass = () => {
      if(card.type === 'MONSTER') return 'monster';
      if(card.type === 'LEADER') return 'leader';
      return card.type.toLowerCase();
  };

  if (isMini) {
    return (
      <div className={`card mini ${getTypeClass()} ${card.isUsedThisTurn ? 'used' : ''}`}>
        <div className="card-header-strip"></div>
        <div className="card-icon">{card.class ? card.class[0] : (card.type === 'MONSTER' ? 'M' : '?')}</div>
        <div className="mini-details">
            <small>{card.name}</small>
            {card.type === 'MONSTER' && <span className="req-text">Req: {card.reqText}</span>}
            {card.type === 'MONSTER' && <span className="roll-req">Target: {card.rollTarget}+</span>}
            {card.rollRequirement && <span className="roll-req">{card.rollRequirement}+</span>}
        </div>
        {canRoll && !card.isUsedThisTurn && (
            <button className="btn-roll" onClick={(e) => { e.stopPropagation(); onRoll(card.uniqueId); }}>🎲</button>
        )}
      </div>
    );
  }

  // Full Card
  return (
    <div className={`card ${getTypeClass()} ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="card-header">
        <span>{card.class || card.type}</span>
        <span>{card.cost !== undefined ? `${card.cost} AP` : ''}</span>
      </div>
      <div className="card-body">
        <h4>{card.name}</h4>
        <p>{card.description || card.effect || card.skill}</p>
        {card.type === 'MONSTER' && (
            <div className="monster-stats">
                <p><strong>Req:</strong> {card.reqText}</p>
                <p><strong>Slay:</strong> {card.rollTarget}+</p>
                <p><strong>Fail:</strong> {card.failTarget}-</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Card;