"use client";

import styled from 'styled-components';
import SwapCards from '../components/dietcards/dietcards';
import PlannerBanner from '../components/dietlink/card';
import RecipeSection from '../components/recipesection/RecipeSection';
import Navbar from '../components/Navbar/navbar';
import PageHeader from '../components/layout/PageHeader';
import { useTranslation } from 'react-i18next';

// Split look, dietary page only: purple sidebar, lilac left panel with the
// purple banner + photo swap cards, regional recipes on the right canvas.
const Container = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  background: linear-gradient(168deg, #ede7f6 0%, #e8dff5 40%, #f3e5f5 100%);
  font-family: 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
`;

const Sidebar = styled.div`
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 44%) minmax(0, 56%);
  gap: 26px;
  padding: 16px 22px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 12px 10px;
  }
`;

const LeftPanel = styled.div`
  background: #faf7ff;
  border: 1px solid #ddd0f2;
  border-radius: 14px;
  padding: 16px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 2px 10px rgba(73, 57, 113, 0.08);
  box-sizing: border-box;
  min-width: 0;
  overflow: visible;
`;

const RightPanel = styled.div`
  min-width: 0;
  padding-top: 4px;
  padding-left: 20px;
  @media (max-width: 900px) {
    padding-left: 0;
  }
`;

export default function DietaryPage() {
  const { t } = useTranslation();
  return (
    <Container>
      <Sidebar>
        <Navbar />
      </Sidebar>
      <Content>
        <div style={{ gridColumn: '1 / -1' }}>
          <PageHeader title={t('nav.dietary')} subtitle={t('dietarySub')} />
        </div>
        <LeftPanel>
          <PlannerBanner />
          <SwapCards />
        </LeftPanel>
        <RightPanel>
          <RecipeSection />
        </RightPanel>
      </Content>
    </Container>
  );
}
