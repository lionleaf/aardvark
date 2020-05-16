import { AvGadget, AvGrabbable, AvPanel, AvStandardGrabbable, AvTransform, GrabResponse, HighlightType } from '@aardvarkxr/aardvark-react';
import { AvGrabEvent, EAction, EHand, g_builtinModelBox } from '@aardvarkxr/aardvark-shared';
import { CroquetSession, startSession } from '@croquet/croquet';
import bind from 'bind-decorator';
import { ACModel, ACView } from 'common/croquet_utils';
import * as React from 'react';
import * as ReactDOM from 'react-dom';


class Counter extends ACModel 
{
	private m_value: number;

	public init( options: any )
	{
		super.init( options );
		this.m_value = 0;

		this.subscribe( this.id, "increment", this.onIncrement );
	}

	public onIncrement()
	{
		this.m_value++;
		this.publish( this.id, "update_value", null );
	}

	public get value(): number
	{
		return this.m_value;
	}
}

Counter.register();

class CounterView extends ACView
{
	private counter: Counter;
	private listener: ( newValue: number ) => void;

	constructor( counter: Counter )
	{
		super( counter );
		this.counter = counter;
		this.subscribe( counter.id, "update_value", this.onValueUpdated );
	}

	public onValueUpdated()
	{
		if( this.listener )
		{
			this.listener( this.counter.value );
		}
	}

	public setListener( listener: ( newValue: number ) => void )
	{
		this.listener = listener;
		listener( this.counter.value );
	}

	public increment()
	{
		this.publish( this.counter.id, "increment", null );
	}
}


interface TestPanelState
{
	count: number;
	grabbableHighlight: HighlightType;
}

interface TestSettings
{
	count: number;
}

class TestPanel extends React.Component< {}, TestPanelState >
{
	private m_actionListeners: number[];
	private m_session: CroquetSession<CounterView>;

	constructor( props: any )
	{
		super( props );
		this.state = 
		{ 
			count: 0,
			grabbableHighlight: HighlightType.None,
		};

		AvGadget.instance().registerForSettings( this.onSettingsReceived );

		AvGadget.instance().getLocalUserInfo()
		.then( ( ) =>
		{
			// once user info is available, start the session
			return startSession( AvGadget.instance().globallyUniqueId, Counter, CounterView );
		})
		.then( ( session: CroquetSession< CounterView > ) =>
		{
			// once the session is available, start listening for changes
			this.m_session = session;
			this.m_session.view.setListener( this.onValueUpdated );
		} );
	}

	public componentDidMount()
	{
		if( !AvGadget.instance().isRemote )
		{
			this.m_actionListeners = 
			[
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.A, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.B, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.Squeeze, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.Grab, this ),
				AvGadget.instance().listenForActionStateWithComponent( EHand.Invalid, EAction.Detach, this ),
			];
		}
	}

	public componentWillUnmount()
	{
		if( !AvGadget.instance().isRemote )
		{
			for( let listener of this.m_actionListeners )
			{
				AvGadget.instance().unlistenForActionState( listener );
			}

			this.m_actionListeners = [];
		}
	}

	@bind 
	private onValueUpdated( newValue: number )
	{
		this.setState( { count: newValue } );

		if( !AvGadget.instance().isRemote )
		{
			let newSettings: TestSettings = { count: newValue };
			AvGadget.instance().saveSettings( newSettings );	
		}
	}

	@bind public incrementCount()
	{
		this.m_session.view.increment();
	}

	@bind public onHighlightGrabbable( highlight: HighlightType )
	{
		this.setState( { grabbableHighlight: highlight } );
	}

	@bind public onGrabRequest( grabRequest: AvGrabEvent ): Promise< GrabResponse >
	{
		// this is totally unnecessary, but a good test of the plumbing.
		let response: GrabResponse =
		{
			allowed: true,
		};
		return Promise.resolve( response );
	}

	@bind public onSettingsReceived( settings: TestSettings )
	{
		if( settings )
		{
			this.setState( { count: settings.count } );
		}
	}

	public renderActionStateLabel( action: EAction )
	{
		if( AvGadget.instance().getActionStateForHand( EHand.Invalid, action ) )
			return <div className="Label">{ EAction[ action ] }: TRUE</div>;
		else
			return <div className="Label">{ EAction[ action ] }: false</div>;
	}

	public renderRemote()
	{
		return (
			<div className="FullPage Remote">
				<div>
					<AvGrabbable >
						<AvTransform translateY={ 0.05 } >
							<AvPanel interactive={false} widthInMeters={ 0.1 }/>
						</AvTransform>
					</AvGrabbable>
				</div>
				<div className="Label">Count: { this.state.count }</div>
				<div className="Label">This gadget is owned by somebody else</div>
			</div>
		);
	}

	public renderLocal()
	{
		let sDivClasses:string = "FullPage";

		return (
			<div className={ sDivClasses } >
				<div>
					<AvStandardGrabbable modelUri={ g_builtinModelBox } modelScale={ 0.03 } 
						modelColor="lightblue" useInitialParent={ true } remoteInterfaceLocks={ [] }>
						<AvTransform translateY={ 0.08 } >
							<AvPanel interactive={true} widthInMeters={ 0.1 }/>
						</AvTransform>
					</AvStandardGrabbable>
				</div>
				<div className="Label">Count: { this.state.count }</div>
				<div className="Label">This gadget is owned by me</div>
				<div className="Button" onMouseDown={ this.incrementCount }>
					Increment count...
				</div> 
				{ this.renderActionStateLabel( EAction.A ) }
				{ this.renderActionStateLabel( EAction.B ) }
				{ this.renderActionStateLabel( EAction.Squeeze ) }
				{ this.renderActionStateLabel( EAction.Grab ) }
				{ this.renderActionStateLabel( EAction.Detach ) }
			</div>
		)
	}

	public render()
	{
		if( AvGadget.instance().isRemote )
			return this.renderRemote();
		else
			return this.renderLocal();
	}

}

ReactDOM.render( <TestPanel/>, document.getElementById( "root" ) );
