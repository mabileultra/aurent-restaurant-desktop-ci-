import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { BaseButton } from '../../../components/ui';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import PosSoundToggle from '../../pos/components/PosSoundToggle';
import RestaurantWorkspaceEmpty from '../../shared/components/RestaurantWorkspaceEmpty';
import PosLoadRetry from '../../pos/components/PosLoadRetry';
import { logoutAndResetSession } from '../../../utils/authSession';
import { unlockPosAudio } from '../../pos/utils/posSounds';
import ReadyDisplayColumn from '../components/ReadyDisplayColumn';
import { useReadyDisplayBoard } from '../hooks/useReadyDisplayBoard';
import '../styles/ready-display.css';

export default function ReadyDisplayPage() {
  const { t } = useTranslation();
  const { hasModule } = useModuleAccess();
  const board = useReadyDisplayBoard();
  const allowed = hasModule('restaurantReadyDisplay');

  if (!allowed) {
    return (
      <div className="rst-rdy">
        <p className="rst-rdy__denied">{t('rst.readyDisplay.denied')}</p>
      </div>
    );
  }

  if (board.workspace.isLoading && board.workspace.storeId == null) {
    return (
      <div className="rst-rdy">
        <p className="rst-rdy__notice">{t('common.loading')}</p>
      </div>
    );
  }

  if (!board.kitchenBoardLoading && !board.kitchenBoardEnabled) {
    return (
      <div className="rst-rdy">
        <p className="rst-rdy__notice">{t('rst.kitchen.boardOff')}</p>
      </div>
    );
  }

  if (board.workspace.noAssignment || board.workspace.multipleAssignment || board.workspace.storeId == null) {
    return (
      <RestaurantWorkspaceEmpty
        t={t}
        workspace={board.workspace}
        onLogout={() => logoutAndResetSession()}
      />
    );
  }

  return (
    <div className="rst-rdy" onPointerDown={unlockPosAudio}>
      <header className="rst-rdy__header">
        <div className="rst-rdy__brand">
          <div className="rst-rdy__logo" aria-hidden>A</div>
          <div>
            <h1 className="rst-rdy__title">{t('rst.readyDisplay.title')}</h1>
            <p className="rst-rdy__store">
              {board.workspace.storeName ?? t('rst.readyDisplay.brand')}
            </p>
          </div>
        </div>
        <div className="rst-rdy__actions">
          <PosSoundToggle t={t} />
          <LanguageSwitcher variant="rst" />
          <BaseButton type="button" variant="ghost" onClick={() => logoutAndResetSession()}>
            {t('nav.logout')}
          </BaseButton>
        </div>
      </header>

      {board.isError ? (
        <PosLoadRetry t={t} messageKey="rst.kitchen.loadFailed" onRetry={board.refetch} />
      ) : null}

      <main className="rst-rdy__body">
        <ReadyDisplayColumn
          variant="cooking"
          title={t('rst.readyDisplay.cooking')}
          subtitle={t('rst.readyDisplay.cookingHint')}
          orders={board.cooking}
          emptyLabel={t('rst.readyDisplay.cookingEmpty')}
        />
        <ReadyDisplayColumn
          variant="ready"
          title={t('rst.readyDisplay.ready')}
          subtitle={t('rst.readyDisplay.readyHint')}
          orders={board.ready}
          emptyLabel={t('rst.readyDisplay.readyEmpty')}
          freshKeys={board.freshKeys}
        />
      </main>
    </div>
  );
}
